// Migration script to update old UploadThing URLs to new v7 format
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateUrls() {
  console.log("🔄 Starting UploadThing URL migration...");

  try {
    // Update user avatars
    const users = await prisma.user.findMany({
      where: {
        avatarUrl: {
          contains: ".ufs.sh/a/",
        },
      },
    });

    console.log(`Found ${users.length} users with old avatar URLs`);

    for (const user of users) {
      if (user.avatarUrl) {
        // Convert /a/{app_id}/{file_key} to /f/{file_key}
        const newUrl = user.avatarUrl.replace(/\/a\/[^\/]+\//, "/f/");

        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: newUrl },
        });

        console.log(
          `✅ Updated user ${user.username}: ${user.avatarUrl} -> ${newUrl}`,
        );
      }
    }

    // Update media attachments
    const mediaItems = await prisma.media.findMany({
      where: {
        url: {
          contains: ".ufs.sh/a/",
        },
      },
    });

    console.log(`Found ${mediaItems.length} media items with old URLs`);

    for (const media of mediaItems) {
      // Convert /a/{app_id}/{file_key} to /f/{file_key}
      const newUrl = media.url.replace(/\/a\/[^\/]+\//, "/f/");

      await prisma.media.update({
        where: { id: media.id },
        data: { url: newUrl },
      });

      console.log(`✅ Updated media ${media.id}: ${media.url} -> ${newUrl}`);
    }

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUrls();
