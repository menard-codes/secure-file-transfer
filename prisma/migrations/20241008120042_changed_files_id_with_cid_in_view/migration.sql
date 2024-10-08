/*
  Warnings:

  - You are about to drop the column `fileId` on the `View` table. All the data in the column will be lost.
  - Added the required column `cid` to the `View` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashedPassphrase" TEXT NOT NULL,
    "cid" TEXT NOT NULL
);
INSERT INTO "new_View" ("hashedPassphrase", "id") SELECT "hashedPassphrase", "id" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
