-- Add persistent learning progress to each function entry.
ALTER TABLE "FunctionEntry"
ADD COLUMN "learningStatus" TEXT NOT NULL DEFAULT 'unlearned';
