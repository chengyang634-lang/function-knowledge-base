-- CreateTable
CREATE TABLE "FunctionEntry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunctionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionVariant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "explanation" TEXT,
    "functionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunctionVariant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FunctionVariant" ADD CONSTRAINT "FunctionVariant_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "FunctionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
