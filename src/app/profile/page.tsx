import Profile from "@/components/profile/Profile";
import Navbar from "@/components/ui/Navbar";
import MetricsForm from "@/components/metrics/MetricsForm";

export default function ProfilePageEntry() {
    return (
        <>
            <Profile />
            <div className="px-4 pb-4 max-w-xl mx-auto">
                <MetricsForm />
            </div>
            <Navbar />
        </>
    );
}
