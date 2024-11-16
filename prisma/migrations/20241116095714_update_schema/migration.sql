/*
  Warnings:

  - You are about to drop the column `authorId` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImage` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `metaDescription` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `metaTitle` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `views` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `post` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_authorId_fkey";

-- DropForeignKey
ALTER TABLE "post_categories_category" DROP CONSTRAINT "post_categories_category_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "post_categories_category" DROP CONSTRAINT "post_categories_category_postId_fkey";

-- DropIndex
DROP INDEX "category_slug_key";

-- DropIndex
DROP INDEX "post_name_key";

-- AlterTable
ALTER TABLE "category" DROP COLUMN "authorId",
DROP COLUMN "content",
DROP COLUMN "createdAt",
DROP COLUMN "featuredImage",
DROP COLUMN "likes",
DROP COLUMN "metaDescription",
DROP COLUMN "metaTitle",
DROP COLUMN "published",
DROP COLUMN "publishedAt",
DROP COLUMN "slug",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
DROP COLUMN "views",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "post" DROP COLUMN "name",
ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "featuredImage" TEXT,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "post_slug_key" ON "post"("slug");

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_categories_category" ADD CONSTRAINT "post_categories_category_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_categories_category" ADD CONSTRAINT "post_categories_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
