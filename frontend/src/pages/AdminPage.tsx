import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BeatUploadSection from '../components/BeatUploadSection';
import BeatManagementSection from '../components/BeatManagementSection';
import FeaturedBeatManagement from '../components/FeaturedBeatManagement';
import ShowcaseApprovalSection from '../components/ShowcaseApprovalSection';
import MixtapeApprovalSection from '../components/MixtapeApprovalSection';
import MixtapeSubmissionFeeConfig from '../components/MixtapeSubmissionFeeConfig';
import YouTubeConfigSection from '../components/YouTubeConfigSection';
import StripeConfigSection from '../components/StripeConfigSection';
import AdminHelpSection from '../components/AdminHelpSection';
import MvaPreviewUploadSection from '../components/MvaPreviewUploadSection';
import LiveShowsManagement from '../components/LiveShowsManagement';
import MilestoneManagement from '../components/MilestoneManagement';
import BasicRightsLicenseManagement from '../components/BasicRightsLicenseManagement';
import PremiumRightsLicenseManagement from '../components/PremiumRightsLicenseManagement';
import ExclusiveRightsLicenseManagement from '../components/ExclusiveRightsLicenseManagement';
import StemsRightsLicenseManagement from '../components/StemsRightsLicenseManagement';
import AnalyticsSection from '../components/AnalyticsSection';
import { Music, Settings, FileCheck, Users, Youtube, CreditCard, HelpCircle, Sparkles, Star, Radio, TrendingUp, FileText, BarChart3, Disc3 } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Manage beats, showcases, mixtapes, and platform settings</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-14 gap-2 h-auto p-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="beats" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Beats</span>
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Featured</span>
          </TabsTrigger>
          <TabsTrigger value="showcases" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Showcases</span>
          </TabsTrigger>
          <TabsTrigger value="mixtapes" className="flex items-center gap-2">
            <Disc3 className="h-4 w-4" />
            <span className="hidden sm:inline">Mixtapes</span>
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            <span className="hidden sm:inline">YouTube</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            <span className="hidden sm:inline">Live</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="mva" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">M.v.A</span>
          </TabsTrigger>
          <TabsTrigger value="license" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">License</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Stripe</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <BeatUploadSection />
        </TabsContent>

        <TabsContent value="beats" className="mt-6">
          <BeatManagementSection />
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <FeaturedBeatManagement />
        </TabsContent>

        <TabsContent value="showcases" className="mt-6">
          <ShowcaseApprovalSection />
        </TabsContent>

        <TabsContent value="mixtapes" className="mt-6">
          <div className="space-y-6">
            <MixtapeSubmissionFeeConfig />
            <MixtapeApprovalSection />
          </div>
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <YouTubeConfigSection />
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          <LiveShowsManagement />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestoneManagement />
        </TabsContent>

        <TabsContent value="mva" className="mt-6">
          <MvaPreviewUploadSection />
        </TabsContent>

        <TabsContent value="license" className="mt-6">
          <div className="space-y-6">
            <BasicRightsLicenseManagement />
            <PremiumRightsLicenseManagement />
            <ExclusiveRightsLicenseManagement />
            <StemsRightsLicenseManagement />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsSection />
        </TabsContent>

        <TabsContent value="stripe" className="mt-6">
          <StripeConfigSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Additional settings coming soon...
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-6">
          <AdminHelpSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
