-- CreateTable
CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cid" TEXT NOT NULL,
    "expiration" DATETIME NOT NULL,
    "passphrase" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_cid_key" ON "FileUpload"("cid");
