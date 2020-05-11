provider "azurerm" {
  version = "~>2.0"
  features {}
}

terraform {
  backend "azurerm" {}
}

data "azurerm_client_config" "current" {}

# Resource Group
# resource "azurerm_resource_group" "rg" {
#   name     = "${var.project_name}-rg-${var.environment}"
#   location = var.location
# }

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "cosmos" {
  name                = "${var.project_name}-cosmos-${var.environment}"
  resource_group_name = var.project_name
  location            = var.location
  offer_type          = "Standard"
  kind                = "MongoDB"

  enable_automatic_failover = false

  consistency_policy {
    consistency_level = "Strong"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableMongo"
  }
}

# Cosmos DB Mongo Database
resource "azurerm_cosmosdb_mongo_database" "mongodb" {
  name                = var.project_name
  resource_group_name = azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

# Cosmos DB Mongo Collection
resource "azurerm_cosmosdb_mongo_collection" "coll_patient" {
  name                = "patient"
  resource_group_name = azurerm_cosmosdb_mongo_database.mongodb.resource_group_name
  account_name        = azurerm_cosmosdb_mongo_database.mongodb.account_name
  database_name       = azurerm_cosmosdb_mongo_database.mongodb.name
  shard_key           = "_shardKey"
  throughput          = 400
}

resource "azurerm_cosmosdb_mongo_collection" "coll_audit" {
  name                = "audit"
  resource_group_name = azurerm_cosmosdb_mongo_database.mongodb.resource_group_name
  account_name        = azurerm_cosmosdb_mongo_database.mongodb.account_name
  database_name       = azurerm_cosmosdb_mongo_database.mongodb.name
  shard_key           = "_shardKey"
  throughput          = 400
}

# Storage Account
resource "azurerm_storage_account" "sa" {
  name                      = "${var.project_name}sa${var.environment}"
  resource_group_name       = var.project_name
  location                  = var.location
  account_kind              = "StorageV2"
  account_tier              = "Standard"
  account_replication_type  = "LRS"
  access_tier               = "Hot"
  enable_https_traffic_only = true
}

# Premium Plan
resource "azurerm_app_service_plan" "asp" {
  name                = "${var.project_name}-asp-${var.environment}"
  resource_group_name = var.project_name
  location            = var.location
  kind                = "elastic"

  sku {
    tier = "ElasticPremium"
    size = "EP1"
  }
}

# Application Insights
resource "azurerm_application_insights" "ai" {
  name                = "${var.project_name}-ai-${var.environment}"
  resource_group_name = var.project_name
  location            = var.location
  application_type    = "Node.JS"
  retention_in_days   = 90
}

# Function App Module
# Patient Test API
module "fa_patient_test_api" {
  source                           = "./modules/function_app"
  name                             = "${var.project_name}-fa-patient-test-api-${var.environment}"
  resource_group_name              = var.project_name
  location                         = var.location
  app_service_plan_id              = azurerm_app_service_plan.asp.id
  storage_account_name             = azurerm_storage_account.sa.name
  storage_account_access_key       = azurerm_storage_account.sa.primary_access_key
  app_insights_instrumentation_key = azurerm_application_insights.ai.instrumentation_key

  extra_app_settings = {
    mongo_connection_string = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.cosmos_conn.id})"
  }

  key_vault_id = azurerm_key_vault.kv.id
}

# Key Vault
resource "azurerm_key_vault" "kv" {
  name                        = "${var.project_name}-kv-${var.environment}"
  resource_group_name         = var.project_name
  location                    = var.location
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_enabled         = false
  purge_protection_enabled    = false

  sku_name = "standard"
}

# Key Vault Access Policy
resource "azurerm_key_vault_access_policy" "sp" {
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "delete",
    "get",
    "set"
  ]
}

# Key Vault Secret
resource "azurerm_key_vault_secret" "cosmos_conn" {
  name         = "cosmos-conn"
  value        = azurerm_cosmosdb_account.cosmos.connection_strings[0]
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [
    azurerm_key_vault_access_policy.sp
  ]
}
