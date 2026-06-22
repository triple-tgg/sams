const permMenus = [
  {
    "menuId": 18,
    "menuCode": "PRODUCTION_PLANNER",
    "canView": false,
    "children": [
      {
        "menuId": 19,
        "menuCode": "PRODUCTION_DASHBOARD",
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

const rawMenuList = [
    {
      groupLabel: "Production Planner",
      id: "production-planner",
      menus: [
        {
          id: "production-planner",
          permCode: "PRODUCTION_PLANNER",
          submenus: [
            {
              permCode: "PRODUCTION_DASHBOARD",
            }
          ]
        }
      ]
    }
];

const result = rawMenuList
    .map((group) => ({
        ...group,
        menus: group.menus
            .map((menu) => {
                if (menu.submenus.length === 0) {
                    return isViewable(menu.permCode) ? menu : null;
                }
                if (menu.permCode && !isViewable(menu.permCode)) {
                    return null;
                }
                const filteredSubs = menu.submenus.filter((sub) =>
                    isViewable(sub.permCode)
                );
                if (filteredSubs.length === 0) return null;
                return { ...menu, submenus: filteredSubs };
            })
            .filter(Boolean),
    }))
    .filter((group) => group.menus.length > 0);

console.log(JSON.stringify(result, null, 2));
