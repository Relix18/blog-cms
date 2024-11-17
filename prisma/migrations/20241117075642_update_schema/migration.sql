-- CreateTable
CREATE TABLE "Social" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "instaLink" TEXT,
    "linkedinLink" TEXT,
    "facebookLink" TEXT,
    "githubLink" TEXT,

    CONSTRAINT "Social_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Social" ADD CONSTRAINT "Social_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
