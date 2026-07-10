import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AircraftTypePage = () => {
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Aircraft Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Aircraft Type management page.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AircraftTypePage;
