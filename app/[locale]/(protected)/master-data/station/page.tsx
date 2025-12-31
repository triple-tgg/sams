import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const StationPage = () => {
    const t = useTranslations("Menu");
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("station")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Station management page content will be displayed here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default StationPage;
