


CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "replyToCommentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Comment_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "PageBlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_replyToCommentId_fkey" FOREIGN KEY ("replyToCommentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "blockId", "content", "createdAt", "expiresAt", "id", "updatedAt") SELECT "authorId", "blockId", "content", "createdAt", "expiresAt", "id", "updatedAt" FROM "Comment";
DROP TABLE "Comment" CASCADE;
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_blockId_idx" ON "Comment"("blockId");
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");
CREATE INDEX "Comment_replyToCommentId_idx" ON "Comment"("replyToCommentId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");
CREATE INDEX "Comment_expiresAt_idx" ON "Comment"("expiresAt");


