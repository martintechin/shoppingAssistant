// Entry point for the Azure Functions v4 programming model.
// Each module self-registers its HTTP trigger via app.http() on import.
import "./functions/activate.js";
import "./functions/getFoodItems.js";
import "./functions/storeFoodItem.js";
import "./functions/updateFoodItem.js";
import "./functions/deleteFoodItem.js";
import "./functions/getStores.js";
import "./functions/storeStore.js";
import "./functions/updateStore.js";
import "./functions/deleteStore.js";
import "./functions/getList.js";
import "./functions/addListItem.js";
import "./functions/updateListItem.js";
import "./functions/deleteListItem.js";
import "./functions/clearChecked.js";
import "./functions/bulkUpdateCategory.js";
import "./functions/getDevices.js";
import "./functions/generateCode.js";
import "./functions/revokeDevice.js";
import "./functions/renewToken.js";
