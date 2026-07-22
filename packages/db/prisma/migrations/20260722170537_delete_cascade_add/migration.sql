-- DropForeignKey
ALTER TABLE "website" DROP CONSTRAINT "website_user_id_fkey";

-- DropForeignKey
ALTER TABLE "website_tick" DROP CONSTRAINT "website_tick_region_id_fkey";

-- DropForeignKey
ALTER TABLE "website_tick" DROP CONSTRAINT "website_tick_website_id_fkey";

-- AddForeignKey
ALTER TABLE "website" ADD CONSTRAINT "website_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_tick" ADD CONSTRAINT "website_tick_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_tick" ADD CONSTRAINT "website_tick_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
