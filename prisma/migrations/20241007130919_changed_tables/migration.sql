/*
  Warnings:

  - You are about to drop the `FileUpload` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FileUpload";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiration" DATETIME NOT NULL,
    "viewId" TEXT NOT NULL,
    CONSTRAINT "Share_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashedPassphrase" TEXT NOT NULL,
    "fileId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Share_viewId_key" ON "Share"("viewId");
