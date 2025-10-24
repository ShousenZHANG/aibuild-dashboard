/*
  Warnings:

  - A unique constraint covering the columns `[uploadedBy,productCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_uploadedBy_fkey";

-- DropIndex
DROP INDEX "public"."Product_productCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Product_uploadedBy_productCode_key" ON "Product"("uploadedBy", "productCode");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
