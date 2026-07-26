import { Language } from "./index";

const sv: Language = {
  locale: "sv-SE",
  sortLocale: "sv",
  categories: [
    "Frukt & Grönt",
    "Bröd & Bageri",
    "Mejeri & Ägg",
    "Kött & Fågel",
    "Fisk & Skaldjur",
    "Skafferi",
    "Fryst",
    "Dryck",
    "Godis & Snacks",
    "Hushåll",
    "Hygien",
    "Övrigt",
  ],
  units: ["st", "g", "kg", "l", "dl", "förp"],
  unitSteps: {
    st: 1,
    "förp": 1,
    kg: 0.5,
    l: 0.5,
    dl: 1,
    g: 100,
  },
  categoryColors: {
    "Frukt & Grönt": "#388e3c",
    "Bröd & Bageri": "#8d6e63",
    "Mejeri & Ägg": "#1976d2",
    "Kött & Fågel": "#d32f2f",
    "Fisk & Skaldjur": "#0288d1",
    Skafferi: "#f57c00",
    Fryst: "#00acc1",
    Dryck: "#7b1fa2",
    "Godis & Snacks": "#e91e63",
    Hushåll: "#5d4037",
    Hygien: "#00897b",
    Övrigt: "#616161",
  },
  ui: {
    // Activation gate
    "activation.title": "Inköpslistan",
    "activation.description": "Ange aktiveringskod för att komma igång",
    "activation.codeLabel": "Aktiveringskod",
    "activation.deviceLabel": "Enhetsnamn (valfritt)",
    "activation.devicePlaceholder": "t.ex. Martins mobil",
    "activation.emptyCode": "Ange en aktiveringskod",
    "activation.failed": "Aktivering misslyckades",
    "activation.submitting": "Aktiverar...",
    "activation.submit": "Aktivera",

    // Tab bar
    "tab.list": "Lista",
    "tab.shop": "Handla",
    "tab.recipes": "Recept",
    "tab.settings": "Inställningar",

    // Settings view
    "settings.title": "Inställningar",
    "settings.back": "Tillbaka",
    "settings.foods": "Varor",
    "settings.stores": "Butiker",
    "settings.deviceTokens": "Enhetsnycklar",

    // Device tokens
    "deviceTokens.title": "Enhetsnycklar",
    "deviceTokens.thisDevice": "(denna enhet)",
    "deviceTokens.unnamed": "Namnlös enhet",
    "deviceTokens.activatedAt": "Aktiverad {date}",
    "deviceTokens.lastUsed": "Senast använd {when}",
    "deviceTokens.lastUsedNever": "Aldrig använd",
    "deviceTokens.revoke": "Återkalla",
    "deviceTokens.confirmRevoke": "Bekräfta återkallning",
    "deviceTokens.revokeFailed": "Kunde inte återkalla enhet",
    "deviceTokens.generateCode": "+ Generera aktiveringskod",
    "deviceTokens.generating": "Genererar...",
    "deviceTokens.generateFailed": "Kunde inte generera kod",
    "deviceTokens.generatedCode": "Aktiveringskod",
    "deviceTokens.copyCode": "Kopiera",
    "deviceTokens.codeCopied": "Kopierad!",
    "deviceTokens.codeHint": "Dela denna kod för att aktivera en ny enhet. Den kan bara användas en gång.",
    "deviceTokens.dismiss": "Stäng",
    "deviceTokens.devicesSection": "Aktiva enheter",
    "deviceTokens.codesSection": "Oanvända koder",
    "deviceTokens.unclaimed": "Oanvänd — dela för att aktivera en enhet",
    "deviceTokens.delete": "Ta bort",
    "deviceTokens.confirmDelete": "Bekräfta borttagning",
    "deviceTokens.deleteFailed": "Kunde inte ta bort kod",
    "deviceTokens.loading": "Laddar enheter...",
    "deviceTokens.empty": "Inga aktiva enheter eller koder.",
    "deviceTokens.expiryWarning": "Din nyckel går ut om {days} dagar.",
    "deviceTokens.renew": "Förnya",
    "deviceTokens.renewing": "Förnyar...",
    "deviceTokens.renewed": "Nyckel förnyad.",
    "deviceTokens.renewFailed": "Kunde inte förnya nyckel",

    // Recipes placeholder
    "recipes.title": "Recept",
    "recipes.placeholder": "Recept kommer snart.",

    // Add item bar
    "addItem.placeholder": "Lägg till vara...",
    "addItem.boughtRecently": "{name} köptes {when}",
    "addItem.addAnyway": "Lägg till ändå",
    "addItem.cancel": "Avbryt",
    "addItem.create": "+ Skapa \"{name}\"",
    "addItem.onList": "på listan",
    "addItem.boughtWhen": "Köpt {when}",

    // List view
    "list.loading": "Laddar listan...",
    "list.empty": "Listan är tom. Sök efter en vara ovan för att lägga till den.",
    "list.couldNotAdd": "Kunde inte lägga till varan",
    "list.couldNotRemove": "Kunde inte ta bort varan",
    "list.checkedSection": "Avprickade",

    // List item row
    "listItem.notePlaceholder": "Skriv en anteckning...",
    "listItem.editNote": "Redigera anteckning",
    "listItem.addNote": "Lägg till anteckning...",
    "listItem.decrease": "Minska antal",
    "listItem.increase": "Öka antal",
    "listItem.remove": "Ta bort {name}",

    // Food item form
    "foodForm.editTitle": "Redigera vara",
    "foodForm.nameLabel": "Namn",
    "foodForm.categoryLabel": "Kategori",
    "foodForm.unitLabel": "Enhet",
    "foodForm.emptyName": "Ange ett namn",
    "foodForm.saveFailed": "Kunde inte spara varan",
    "foodForm.deleteFailed": "Kunde inte ta bort varan",
    "foodForm.lastBought": "Senast köpt: {date}",
    "foodForm.confirmDelete": "Bekräfta borttagning",
    "foodForm.delete": "Ta bort",
    "foodForm.cancel": "Avbryt",
    "foodForm.saving": "Sparar...",
    "foodForm.save": "Spara",

    // Foods view
    "foods.title": "Varor",
    "foods.categories": "Kategorier",
    "foods.searchPlaceholder": "Sök i varudatabasen...",
    "foods.loading": "Laddar varor...",
    "foods.noMatch": "Ingen träff.",
    "foods.empty": "Varudatabasen är tom.",
    "foods.boughtWhen": "Köpt {when}",
    "foods.count": "{count} st",

    // New food item modal
    "newFood.title": "Ny vara",
    "newFood.emptyName": "Ange ett namn",
    "newFood.createFailed": "Kunde inte skapa varan",
    "newFood.cancel": "Avbryt",
    "newFood.saving": "Sparar...",
    "newFood.submit": "Skapa och lägg till",

    // Shopping row
    "shopping.unavailable": "Finns ej här",

    // Shopping view
    "shop.hintSelectStore": "Välj en butik för att sortera listan efter din väg genom butiken.",
    "shop.hintAddStore": "Lägg till en butik under Inställningar → Butiker för att sortera listan efter din väg genom butiken och se vilka varor som saknas där.",
    "shop.loading": "Laddar listan...",
    "shop.empty": "Listan är tom — inget att handla!",
    "shop.updateFailed": "Kunde inte uppdatera varan",
    "shop.clearFailed": "Kunde inte rensa listan",
    "shop.confirmClear": "Bekräfta rensning",
    "shop.cancel": "Avbryt",
    "shop.clearChecked": "Rensa avprickade ({count})",

    // Category manager
    "catManager.newTitle": "Ny kategori",
    "catManager.nameLabel": "Namn",
    "catManager.alreadyExists": "Kategorin finns redan",
    "catManager.back": "Tillbaka",
    "catManager.createAndAssign": "Skapa och tilldela varor",
    "catManager.assignTitle": "Tilldela till \"{name}\"",
    "catManager.alreadyIn": "Redan i kategorin ({count})",
    "catManager.selectItems": "Välj varor att flytta hit",
    "catManager.filterPlaceholder": "Filtrera varor...",
    "catManager.selectAll": "Markera alla synliga",
    "catManager.deselectAll": "Avmarkera alla",
    "catManager.selectedCount": "{count} valda",
    "catManager.noMatch": "Ingen träff.",
    "catManager.noItems": "Inga varor att flytta.",
    "catManager.moveOne": "Flytta 1 vara",
    "catManager.moveMany": "Flytta {count} varor",
    "catManager.saving": "Sparar...",
    "catManager.updateFailed": "Kunde inte uppdatera",
    "catManager.title": "Kategorier",
    "catManager.itemCount": "{count} varor",
    "catManager.close": "Stäng",
    "catManager.newCategory": "+ Ny kategori",

    // Category order editor
    "catOrder.moveUp": "Flytta {name} uppåt",
    "catOrder.moveDown": "Flytta {name} nedåt",

    // Store form
    "storeForm.newTitle": "Ny butik",
    "storeForm.editTitle": "Redigera butik",
    "storeForm.nameLabel": "Namn",
    "storeForm.namePlaceholder": "t.ex. ICA Maxi Häggvik",
    "storeForm.departmentOrder": "Avdelningsordning (din väg genom butiken)",
    "storeForm.unavailableItems": "Varor som saknas i butiken",
    "storeForm.emptyName": "Ange ett namn på butiken",
    "storeForm.saveFailed": "Kunde inte spara butiken",
    "storeForm.deleteFailed": "Kunde inte ta bort butiken",
    "storeForm.confirmDelete": "Bekräfta borttagning",
    "storeForm.delete": "Ta bort",
    "storeForm.cancel": "Avbryt",
    "storeForm.saving": "Sparar...",
    "storeForm.save": "Spara",

    // Stores view
    "stores.title": "Butiker",
    "stores.newStore": "+ Ny butik",
    "stores.loading": "Laddar butiker...",
    "stores.empty": "Inga butiker ännu. Lägg till dina vanliga butiker och ange i vilken ordning avdelningarna kommer när du går genom butiken.",
    "stores.departments": "{count} avdelningar",
    "stores.itemsMissing": "{count} varor saknas",

    // Unavailable picker
    "unavailable.placeholder": "Sök vara att markera som saknad...",
    "unavailable.noMatch": "Ingen träff",
    "unavailable.removeLabel": "Ta bort {name} från saknade varor",

    // Modal
    "modal.close": "Stäng",

    // Dates
    "date.today": "idag",
    "date.yesterday": "igår",
  },
};

export default sv;
