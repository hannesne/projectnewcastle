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

# Consumption Plan
resource "azurerm_app_service_plan" "asp" {
  name                = "${var.project_name}-asp-${var.environment}"
  resource_group_name = var.project_name
  location            = var.location
  kind                = "FunctionApp"

  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}
