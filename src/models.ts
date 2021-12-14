import { model, Schema, Types } from "mongoose";

export interface CoordinatesPosition {
	x: number;
	y: number;
  }

export interface Role {
	id: string;
	name: string;
}

const RoleSchema = new Schema({
	id: {
		type: String,
		trim: true,
		required: true,
		unique: true,
	},
	name: {
		type: String,
		trim: true,
		required: true,
		unique: true,
	  },
	},
	{ timestamps: true }
);

export const RoleModel = model<Role>("Role", RoleSchema);

export interface User {
	/* userId*/
	id: string;
	roles: Role[];
}

const UserSchema = new Schema(
	{
		id: {type: String, required: true, unique: true},
		roles: [{ type: Types.ObjectId, ref: RoleModel }],
	}
)

export const UserModel = model<User>("User", UserSchema);

export interface Room {
	/* 部屋のID, urlのパスになる */
	id: string;
	/* 部屋名 */
	name: string
}

const RoomSchema = new Schema(
	{
		id: {type: String, required: true, unique: true},
		name: {type: String, trim: true}
	}
)

export const RoomModel = model<Room>("Room", RoomSchema);

export interface UserRoom {
	id: string
	roomId: string;
	userId: string;
	socketId: string;
	roomName: string;
}

const UserRoomSchema = new Schema(
	{
		id: {type: String, required: true, unique: true},
		roomId: {
			type: String,
			trim: true,
			required: true,
		  },
		userId: {
			type: String,
			trim: true,
			required: true,
			index: true,
		  },
		socketId: {
			type: String,
			trim: true,
			require: true,
			unique: true,
			index: true,
		  },
		  roomName: {
			type: String,
			trim: true,
			required: true,
		  },
	}
)

export const UserRoomModel = model<UserRoom>("UserRoom", UserRoomSchema);

