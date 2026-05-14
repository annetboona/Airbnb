import type { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";



export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  // req.file is set by Multer — if it's missing, no file was sent
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
  const { url, publicId } = await uploadToCloudinary(
    req.file.buffer,
    "airbnb/avatars"
  );

  // Save the Cloudinary URL to the user's record in the database
  const updated = await prisma.user.update({
    where: { id },
    data: { avatar: url },
  });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}