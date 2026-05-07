-- AlterTable
ALTER TABLE "PageBlock" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PageBlock_isHidden_idx" ON "PageBlock"("isHidden");
