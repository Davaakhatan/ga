use('admin')

db.createUser({
  user: "admin",
  pwd: "Test123",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase"]
});


mongosh "mongodb://localhost:27017" --username admin --authenticationDatabase admin

db.updateUser("admin", { pwd: "" });

db.updateUser("admin", { pwd: "Test123" });

