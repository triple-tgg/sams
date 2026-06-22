const permMenus = [
  {
    "menuId": 18,
    "menuCode": "PRODUCTION_PLANNER",
    "name": "Production Planner",
    "canView": false,
    "children": [
      {
        "menuId": 19,
        "menuCode": "PRODUCTION_DASHBOARD",
        "name": "Dashboard",
        "canView": false
      }
    ]
  }
];

function flattenPermissions(items) {
    const result = [];
    for (const item of items) {
        result.push(item);
        if (item.children && item.children.length > 0) {
            result.push(...flattenPermissions(item.children));
        }
        if (item.submenus && item.submenus.length > 0) {
            result.push(...flattenPermissions(item.submenus));
        }
    }
    return result;
}

const flat = flattenPermissions(permMenus);
const canViewMap = new Map(flat.map((m) => [m.menuCode, m.canView]));

const isViewable = (code) => {
    if (!code) return true;
    return canViewMap.get(code) === true;
};

console.log("PRODUCTION_PLANNER:", isViewable("PRODUCTION_PLANNER"));
console.log("PRODUCTION_DASHBOARD:", isViewable("PRODUCTION_DASHBOARD"));
