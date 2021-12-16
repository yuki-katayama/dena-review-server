import { Server as ServerHttp } from "http";
import { Server, Socket } from "socket.io";
import { RoomModel, Room, UserRoomModel, UserModel, CoordinatesPosition } from "./models";
import { v4 } from "uuid";

const socketToUserId: { [socketId: string]: string } = {};

export async function initSyncService(server: ServerHttp) {
    const io = new Server(server, {cors: {
        origin: "*"
    }});
    io.on('connection', (s: Socket) => {
        s.on('accessed user', async (userId: string) => {
            socketToUserId[s.id] = userId;
            s.join("accessed");
            s.join(s.id);
            console.log("accessed: ", userId)
            await notifyRoomState(io);
        });

        s.on('add room', async (roomName: string) => {
            await addRoom(roomName);
            const room = await RoomModel.findOne({ name: roomName }).exec();
            await UserRoomModel.create({id: v4(), userId: socketToUserId[s.id], roomName: roomName, roomId: room!.id, socketId: s.id});
            console.log("addRoom: ", roomName)
            await notifyRoomState(io)
        });

        s.on('join room', async (roomName: string) => {
            const room = await RoomModel.findOne({ name: roomName }).exec();
            let secondUser = false
            if (!room) {
            /* ユーザーがdisconnectした時 */
                console.log("not found room")
                s.emit("not found room")
                return;
            }
            const ur = await UserRoomModel.findOne({ roomName: roomName }).exec()
            if (ur) {
                secondUser = true
            }
            await UserRoomModel.create({id: v4(), roomId: room.id, userId: socketToUserId[s.id], socketId: s.id, roomName: roomName});
            let userRooms = await UserRoomModel.find().lean().exec();
            s.join(roomName)
            io.to(roomName).emit("user join room", userRooms);
            if (secondUser) {
                io.to(s.id).emit("second user join room");
            }
            console.log("joinRoom: ", roomName)
            await notifyRoomState(io)
        });

        s.on('put coin', async (position: CoordinatesPosition) => {
            const ur = await UserRoomModel.findOne({ socketId: s.id }).exec()
            if (!ur) {
                return ;
            }
            io.to(ur.roomName).emit("user put coin", position);
        })

        s.on('reset', async () => {
            const ur = await UserRoomModel.findOne({ socketId: s.id }).exec()
            if (!ur) {
                return ;
            }
            io.to(ur.roomName).emit("user reset");
        })

        s.on('finish', async () => {
            const ur = await UserRoomModel.findOne({ socketId: s.id }).exec()
            if (!ur) {
                return ;
            }
            io.to(ur.roomName).emit("user finish");
        })

        s.on('leave room', async () => {
            console.log("leave room")
            await leaveOrDisconnect(io, s);
        })

        s.on('disconnect', async () => {
            console.log("disconnect");
            await leaveOrDisconnect(io, s);
        })

        s.on('get room state', async () => {
            console.log("getRoomState: ")
            await notifyRoomState(io)
        })
    });
}

async function addRoom(roomName: string): Promise<void> {
    let room = await RoomModel.findOne({name: roomName}).exec();
    if (!room) {
        await RoomModel.create({id: v4(), name: roomName});
    }
}

async function leaveOrDisconnect(io: Server, s: Socket): Promise<void> {
    const states = await UserRoomModel.find().lean().exec();
    const state = await UserRoomModel.findOne({socketId: s.id}).exec();
    if (state) {
        const room = await RoomModel.findOne({id: state.roomId}).exec();
        const userNumInRoom: number = states.filter((s) => s.roomId === state!.roomId).length
        if (userNumInRoom == 1) {
            await RoomModel.deleteOne({id: state.roomId});
        }
        await UserRoomModel.deleteOne({socketId: s.id});
        s.leave(s.id)
        s.leave(state.roomName);
        await notifyRoomState(io)
    }
}

async function notifyRoomState(io: Server) {
    let rooms: Room[] = await RoomModel.find().lean().exec();
    io.to("accessed").emit("update rooms state", rooms)
}