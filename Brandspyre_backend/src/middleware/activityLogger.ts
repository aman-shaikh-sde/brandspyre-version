import { Request, Response, NextFunction } from "express";
import { LogEntry } from "../db/ModelSceham/user/18_loginEntry";
import { todayDate, todayTime } from "../db/timezone";

export const activityLogger = (req: Request, res: Response, next: NextFunction) => {
  res.on("finish", async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const path = req.originalUrl || req.url;
      const method = req.method;
      
      let action = "";
      
      if (path.includes("/users/login") && method === "POST") {
        action = "Logged in";
      } else if (path.includes("/project/overview/create") && method === "POST") {
        action = "Created project";
      } else if (path.includes("/project/overview/edit") && method === "PUT") {
        action = "Edited project";
      } else if (path.includes("/project/overview/delete") && method === "DELETE") {
        action = "Deleted project";
      } else if (path.includes("/project/milestone/create") && method === "POST") {
        action = "Created project milestone";
      } else if (path.includes("/project/milestone/edit") && method === "PUT") {
        action = "Edited project milestone";
      } else if (path.includes("/project/milestone/delete") && method === "DELETE") {
        action = "Deleted project milestone";
      } else if (path.includes("/project/task/create") && method === "POST") {
        action = "Created task";
      } else if (path.includes("/project/task/edit") && method === "PUT") {
        action = "Edited task";
      } else if (path.includes("/project/task/delete") && method === "DELETE") {
        action = "Deleted task";
      } else if (path.includes("/client/overview/create") && method === "POST") {
        action = "Created client";
      } else if (path.includes("/client/overview/edit") && method === "PUT") {
        action = "Edited client";
      } else if (path.includes("/client/overview/delete") && method === "DELETE") {
        action = "Deleted client";
      } else if (path.includes("/campaign/overview/create") && method === "POST") {
        action = "Created campaign";
      } else if (path.includes("/campaign/overview/edit") && method === "PUT") {
        action = "Edited campaign";
      } else if (path.includes("/campaign/overview/delete") && method === "DELETE") {
        action = "Deleted campaign";
      } else if (path.includes("/meetings/meetings") && method === "POST") {
        action = path.includes("instant") ? "Started instant meeting" : "Scheduled meeting";
      } else if (path.includes("/meetings/meetings") && method === "PUT") {
        action = "Updated meeting";
      } else if (path.includes("/meetings/meetings") && method === "DELETE") {
        action = "Deleted meeting";
      } else if (path.includes("/pay/create") && method === "POST") {
        action = "Created payment";
      } else if (path.includes("/pay/edit") && method === "PUT") {
        action = "Edited payment";
      } else if (path.includes("/pay/delete") && method === "DELETE") {
        action = "Deleted payment";
      } else if (path.includes("/invoice") && method === "POST") {
        action = "Created invoice";
      } else if (path.includes("/users/create") && method === "POST") {
        action = "Created employee profile";
      } else if (path.includes("/users/edit") && method === "PUT") {
        action = "Edited employee profile";
      } else if (path.includes("/document-templates") && method === "POST") {
        action = path.includes("publish") ? "Published document template" : path.includes("duplicate") ? "Duplicated document template" : "Created document template";
      } else if (path.includes("/document-templates") && method === "PUT") {
        action = "Edited document template";
      } else if (path.includes("/document-templates") && method === "DELETE") {
        action = "Deleted document template";
      }

      if (action && req.user) {
        try {
          const { userId, brcode } = req.user as any;
          const ip = req.ip || req.socket.remoteAddress || "";
          
          await LogEntry.create({
            branchcode: brcode || "",
            staff_id: userId,
            date: todayDate,
            time: todayTime,
            ip,
            device: action // Store the activity name in the device field
          });
        } catch (err) {
          console.error("Error writing activity log:", err);
        }
      }
    }
  });
  next();
};
