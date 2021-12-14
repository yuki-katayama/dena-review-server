import mongoose from "mongoose";
import { UserRoomModel, RoleModel, User, UserModel } from "./models";
import { v4 as uuidv4 } from "uuid";


export async function initDenadb() {
	mongoose.Promise = global.Promise;
	await mongoose.connect("mongodb://localhost:27017/denadb");
	await createInitialDB();
  }

  async function createInitialDB() {
	await UserRoomModel.deleteMany().exec();
	let adminRole: any = await RoleModel.findOne({ id: "Admin" }).exec();
	if (adminRole) {
	  return;
	}
	let roles = await RoleModel.create([
	  { id: "Admin", name: "Administrator" },
	  { id: "OrganizationAdmn", name: "組織管理者" },
	]);
	console.log("created roles", roles);
	adminRole = roles.find((r) => r.id == "Admin");
	let user: User = {
	  id: uuidv4(),
	  roles: [adminRole],
	};
	let users = await UserModel.create([user]);
	console.log("created users", users);
}