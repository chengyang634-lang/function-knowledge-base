-- CreateTable
CREATE TABLE "_FunctionRelations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FunctionRelations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FunctionRelations_B_index" ON "_FunctionRelations"("B");

-- AddForeignKey
ALTER TABLE "_FunctionRelations" ADD CONSTRAINT "_FunctionRelations_A_fkey" FOREIGN KEY ("A") REFERENCES "FunctionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FunctionRelations" ADD CONSTRAINT "_FunctionRelations_B_fkey" FOREIGN KEY ("B") REFERENCES "FunctionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
