import { Contract } from "fabric-contract-api";
export class GrievanceContract extends Contract {
    // ================================
    // VALIDATION UTILITIES
    // ================================
    validateUrgency(value) {
        const allowed = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (!allowed.includes(value)) {
            throw new Error(`Invalid urgency '${value}'. Allowed: ${allowed.join(", ")}`);
        }
    }
    validateStatus(value) {
        const allowed = [
            'REGISTERED',
            'UNDER_PROCESSING',
            'FORWARDED',
            'ON_HOLD',
            'COMPLETED',
            'REJECTED',
            'ESCALATED_TO_MUNICIPAL_LEVEL',
            'ESCALATED_TO_STATE_LEVEL',
            'DELETED'
        ];
        if (!allowed.includes(value)) {
            throw new Error(`Invalid status '${value}'. Allowed: ${allowed.join(", ")}`);
        }
    }
    async ComplaintExists(ctx, id) {
        const data = await ctx.stub.getState(id);
        return !!data && data.length > 0;
    }
    // ================================
    // CREATE COMPLAINT
    // ================================
    async CreateComplaint(ctx, complaintJSON) {
        const complaint = JSON.parse(complaintJSON);
        // Basic validation
        if (!complaint.id)
            throw new Error("Missing complaint.id");
        if (!complaint.description)
            throw new Error("Missing description");
        if (!complaint.categoryId)
            throw new Error("Missing categoryId");
        if (!complaint.complainantId)
            throw new Error("Missing complainantId");
        // Validate urgency
        this.validateUrgency(complaint.urgency);
        // Validate seq
        if (typeof complaint.seq !== "number") {
            throw new Error("seq must be a number");
        }
        const exists = await this.ComplaintExists(ctx, complaint.id);
        if (exists)
            throw new Error(`Complaint ${complaint.id} already exists`);
        const now = new Date().toISOString();
        complaint.createdAt = now;
        complaint.updatedAt = now;
        await ctx.stub.putState(complaint.id, Buffer.from(JSON.stringify(complaint)));
    }
    // ================================
    // READ
    // ================================
    async GetComplaint(ctx, id) {
        const data = await ctx.stub.getState(id);
        if (!data || data.length === 0)
            throw new Error(`Complaint ${id} not found`);
        return data.toString();
    }
    // ================================
    // UPDATE COMPLAINT
    // ================================
    async UpdateComplaint(ctx, updatedJSON) {
        const incoming = JSON.parse(updatedJSON);
        if (!incoming.id)
            throw new Error("Missing complaint.id");
        const data = await ctx.stub.getState(incoming.id);
        if (!data || data.length === 0)
            throw new Error(`Complaint ${incoming.id} not found`);
        const existing = JSON.parse(data.toString());
        // Validate urgency if changing
        if (incoming.urgency) {
            this.validateUrgency(incoming.urgency);
        }
        const merged = {
            ...existing,
            ...incoming,
            updatedAt: new Date().toISOString(),
        };
        await ctx.stub.putState(existing.id, Buffer.from(JSON.stringify(merged)));
    }
    // ================================
    // UPDATE STATUS
    // ================================
    async UpdateStatus(ctx, complaintId, newStatus, resolutionDate) {
        this.validateStatus(newStatus);
        const data = await ctx.stub.getState(complaintId);
        if (!data || data.length === 0)
            throw new Error(`Complaint ${complaintId} not found`);
        const complaint = JSON.parse(data.toString());
        complaint.status = newStatus;
        complaint.updatedAt = new Date().toISOString();
        if (newStatus === "COMPLETED") {
            complaint.dateOfResolution = resolutionDate || new Date().toISOString();
        }
        await ctx.stub.putState(complaintId, Buffer.from(JSON.stringify(complaint)));
    }
    // ================================
    // QUERY ALL
    // ================================
    async QueryAll(ctx) {
        const iterator = await ctx.stub.getStateByRange("", "");
        const results = [];
        for await (const res of iterator) {
            if (res.value && res.value.length > 0) {
                results.push(JSON.parse(res.value.toString("utf8")));
            }
        }
        return JSON.stringify(results);
    }
    // ================================
    // QUERY BY USER
    // ================================
    async QueryByUser(ctx, userId) {
        const query = {
            selector: { complainantId: userId },
        };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = [];
        for await (const res of iterator) {
            results.push(JSON.parse(res.value.toString("utf8")));
        }
        return JSON.stringify(results);
    }
    // ================================
    // QUERY BY STATUS
    // ================================
    async QueryByStatus(ctx, status) {
        this.validateStatus(status);
        const query = {
            selector: { status },
        };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = [];
        for await (const res of iterator) {
            results.push(JSON.parse(res.value.toString("utf8")));
        }
        return JSON.stringify(results);
    }
    // ================================
    // GET HISTORY
    // ================================
    async GetHistory(ctx, id) {
        const iterator = await ctx.stub.getHistoryForKey(id);
        const history = [];
        for await (const item of iterator) {
            history.push({
                txId: item.txId,
                isDelete: item.isDelete,
                timestamp: item.timestamp
                    ? new Date(item.timestamp.seconds * 1000).toISOString()
                    : "",
                value: item.isDelete ? null : JSON.parse(item.value.toString("utf8")),
            });
        }
        return JSON.stringify(history);
    }
}
export const contracts = [GrievanceContract];
