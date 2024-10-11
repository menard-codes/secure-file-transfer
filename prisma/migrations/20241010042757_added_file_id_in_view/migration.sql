/*
  Warnings:

  - Added the required column `fileId` to the `View` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashedPassphrase" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "fileId" TEXT NOT NULL
);
INSERT INTO "new_View" ("cid", "hashedPassphrase", "id") SELECT "cid", "hashedPassphrase", "id" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE UNIQUE INDEX "View_fileId_key" ON "View"("fileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
