import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AircraftTypeLicensePage = () => {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Aircraft Type License</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Aircraft Type License management page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AircraftTypeLicensePage;
