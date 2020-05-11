variable "name" {}

variable "resource_group_name" {}

variable "location" {}

variable "app_service_plan_id" {}

variable "storage_account_name" {}

variable "storage_account_access_key" {}

variable "app_insights_instrumentation_key" {}

variable "extra_app_settings" {
  type    = map
  default = {}
}

variable "key_vault_id" {}
