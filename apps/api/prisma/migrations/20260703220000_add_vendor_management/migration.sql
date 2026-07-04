-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "terms" TEXT;
