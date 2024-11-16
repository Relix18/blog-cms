/*
  Warnings:

  - You are about to drop the `PostCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PostCategory" DROP CONSTRAINT "PostCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "PostCategory" DROP CONSTRAINT "PostCategory_postId_fkey";

-- DropTable
DROP TABLE "PostCategory";

-- CreateTable
CREATE TABLE "post_categories_category" (
    "postId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "post_categories_category_pkey" PRIMARY KEY ("postId","categoryId")
);

-- AddForeignKey
ALTER TABLE "post_categories_category" ADD CONSTRAINT "post_categories_category_postId_fkey" FOREIGN KEY ("postId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_categories_category" ADD CONSTRAINT "post_categories_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
