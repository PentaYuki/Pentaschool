-- Allow one student to link with the same teacher across multiple classes.
-- Legacy schema had unique(studentId, teacherId), which blocked class-specific links.
DROP INDEX IF EXISTS "StudentTeacher_studentId_teacherId_key";

-- Add classId column if it doesn't exist
ALTER TABLE "StudentTeacher" ADD COLUMN "classId" TEXT;

-- Add foreign key constraint
ALTER TABLE "StudentTeacher" ADD CONSTRAINT "StudentTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "StudentTeacher_studentId_teacherId_classId_key"
ON "StudentTeacher"("studentId", "teacherId", "classId");

CREATE INDEX "StudentTeacher_classId_idx" ON "StudentTeacher"("classId");
