import { DashboardService } from '@/services/dashboard.service';
import { ResponseHandler } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

export class DashboardController {
    private dashboardService: DashboardService;

    constructor() {
        this.dashboardService = new DashboardService();
    }

    /**
     * Get comprehensive dashboard analytics
     */
    getDashboardAnalytics = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const userRole = req.user!.role;
            const userBranchId = req.user!.branchId;

            const analytics = await this.dashboardService.getDashboardAnalytics(
                {
                    branchId: query.branchId as string,
                    startDate: query.startDate
                        ? new Date(query.startDate as string)
                        : undefined,
                    endDate: query.endDate
                        ? new Date(query.endDate as string)
                        : undefined,
                },
                userRole,
                userBranchId
            );

            ResponseHandler.success(
                res,
                analytics,
                'Dashboard analytics retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get sales chart data for visualization
     */
    getSalesChartData = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const userRole = req.user!.role;
            const userBranchId = req.user!.branchId;

            const chartData = await this.dashboardService.getSalesChartData(
                {
                    branchId: query.branchId as string,
                    period: (query.period as any) || 'daily',
                    limit: query.limit ? parseInt(query.limit as string) : 7,
                },
                userRole,
                userBranchId
            );

            ResponseHandler.success(
                res,
                chartData,
                'Sales chart data retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get inventory alerts (low stock & out of stock)
     */
    getInventoryAlerts = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = req.query;
            const userRole = req.user!.role;
            const userBranchId = req.user!.branchId;

            const alerts = await this.dashboardService.getInventoryAlerts(
                {
                    branchId: query.branchId as string,
                    limit: query.limit ? parseInt(query.limit as string) : 10,
                    alertType: (query.alertType as any) || 'all',
                },
                userRole,
                userBranchId
            );

            ResponseHandler.success(
                res,
                alerts,
                'Inventory alerts retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    };
}
