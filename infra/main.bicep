targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Base name used to derive resource names')
param appName string = 'shoppingassistant'

@description('SKU for the Static Web App')
@allowed(['Free', 'Standard'])
param swaSku string = 'Free'

@description('Location for Static Web App (limited region availability)')
@allowed(['centralus', 'eastus2', 'westus2', 'westeurope', 'eastasia'])
param swaLocation string = 'westeurope'

@description('Owner tag for policy compliance')
param ownerTag string = 'shoppingassistant'

@description('Secret used to sign JWT tokens for device authentication')
@secure()
param jwtSecret string

@description('Application language (en or sv)')
@allowed(['en', 'sv'])
param appLanguage string = 'en'

var storageAccountName = 'st${take(replace(appName, '-', ''), 9)}${uniqueString(resourceGroup().id)}'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  tags: {
    owner: ownerTag
    app: appName
  }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
  }
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource foodItemsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: tableService
  name: 'FoodItems'
}

resource storesTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: tableService
  name: 'Stores'
}

resource shoppingListTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: tableService
  name: 'ShoppingList'
}

resource deviceAuthTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  parent: tableService
  name: 'DeviceAuth'
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: 'swa-${appName}'
  location: swaLocation
  tags: {
    owner: ownerTag
    app: appName
  }
  sku: {
    name: swaSku
    tier: swaSku
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      appLocation: '/frontend'
      apiLocation: '/api'
      outputLocation: 'dist'
      skipGithubActionWorkflowGeneration: true
    }
  }
}

resource swaAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    JWT_SECRET: jwtSecret
    APP_LANGUAGE: appLanguage
  }
}

output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output storageAccountName string = storageAccount.name
