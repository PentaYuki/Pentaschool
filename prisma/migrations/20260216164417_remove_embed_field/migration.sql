/*
  Warnings:

  - You are about to drop the column `embedCode` on the `PageBlock` table. All the data in the column will be lost.
  - You are about to drop the column `embedPageId` on the `PageBlock` table. All the data in the column will be lost.

*/



CREATE TABLE "new_PageBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "videoUrl" TEXT,
    "videoType" TEXT,
    "poster" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "PageBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PageBlock" ("content", "createdAt", "id", "order", "pageId", "poster", "type", "updatedAt", "videoType", "videoUrl") SELECT "content", "createdAt", "id", "order", "pageId", "poster", "type", "updatedAt", "videoType", "videoUrl" FROM "PageBlock";
DROP TABLE "PageBlock" CASCADE;
ALTER TABLE "new_PageBlock" RENAME TO "PageBlock";
CREATE INDEX "PageBlock_pageId_idx" ON "PageBlock"("pageId");
CREATE INDEX "PageBlock_type_idx" ON "PageBlock"("type");
CREATE INDEX "PageBlock_order_idx" ON "PageBlock"("order");


