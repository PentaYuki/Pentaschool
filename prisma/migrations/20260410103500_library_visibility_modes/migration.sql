-- Add public/class-scoped visibility for teacher library files.
-- PUBLIC: visible to all students
-- CLASS: visible only to students linked to the same class (or shared teacher links when classId is null)

-- Create LibraryFile table if it doesn't exist
CREATE TABLE IF NOT EXISTS "LibraryFile" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryFile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LibraryFile_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LibraryFile_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create LibraryComment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "LibraryComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryComment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LibraryComment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "LibraryFile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LibraryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LibraryFile_teacherId_idx" ON "LibraryFile"("teacherId");
CREATE INDEX IF NOT EXISTS "LibraryFile_classId_idx" ON "LibraryFile"("classId");
CREATE INDEX IF NOT EXISTS "LibraryFile_visibility_idx" ON "LibraryFile"("visibility");
CREATE INDEX IF NOT EXISTS "LibraryFile_createdAt_idx" ON "LibraryFile"("createdAt");
CREATE INDEX IF NOT EXISTS "LibraryComment_fileId_idx" ON "LibraryComment"("fileId");
CREATE INDEX IF NOT EXISTS "LibraryComment_authorId_idx" ON "LibraryComment"("authorId");
