import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const MasterDataPage = () => {
    const t = useTranslations("Menu");
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("master-data")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Select a menu item from the sidebar to manage master data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default MasterDataPage;
