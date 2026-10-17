-- Update properties_status_check to allow 'closed', 'sold', 'active', 'inactive'
ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "properties_status_check";
ALTER TABLE "properties" ADD CONSTRAINT "properties_status_check" 
  CHECK ("status" IN ('pending', 'approved', 'rejected', 'closed', 'sold', 'active', 'inactive'));

-- Update appointments_status_check to allow 'no_show', 'awaiting_customer'
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_status_check";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_status_check" 
  CHECK ("status" IN ('pending', 'approved', 'rejected', 'completed', 'cancelled', 'no_show', 'no-show', 'awaiting_customer'));
