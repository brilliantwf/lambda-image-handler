"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterlaceAction = void 0;
const __1 = require("..");
const _base_1 = require("./_base");
class InterlaceAction extends _base_1.BaseImageAction {
    constructor() {
        super(...arguments);
        this.name = 'interlace';
    }
    validate(params) {
        let opt = { interlace: false };
        if (params.length !== 2) {
            throw new __1.InvalidArgument('Interlace param error, e.g: interlace,1');
        }
        if (params[1] === '1') {
            opt.interlace = true;
        }
        else if (params[1] === '0') {
            opt.interlace = false;
        }
        else {
            throw new __1.InvalidArgument('Interlace must be 0 or 1');
        }
        return opt;
    }
    async process(ctx, params) {
        const opt = this.validate(params);
        const metadata = await ctx.image.metadata();
        if (('jpg' === metadata.format || 'jpeg' === metadata.format) && opt.interlace) {
            ctx.image.jpeg({ progressive: true });
        }
    }
}
exports.InterlaceAction = InterlaceAction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJsYWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3Byb2Nlc3Nvci9pbWFnZS9pbnRlcmxhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMEJBQTREO0FBQzVELG1DQUEwQztBQUsxQyxNQUFhLGVBQWdCLFNBQVEsdUJBQWU7SUFBcEQ7O1FBQ2tCLFNBQUksR0FBVyxXQUFXLENBQUM7SUEwQjdDLENBQUM7SUF4QlEsUUFBUSxDQUFDLE1BQWdCO1FBQzlCLElBQUksR0FBRyxHQUFrQixFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUU5QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sSUFBSSxtQkFBZSxDQUFDLHlDQUF5QyxDQUFDLENBQUM7U0FDdEU7UUFDRCxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDckIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDdEI7YUFBTSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDNUIsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7U0FDdkI7YUFBTTtZQUNMLE1BQU0sSUFBSSxtQkFBZSxDQUFDLDBCQUEwQixDQUFDLENBQUM7U0FDdkQ7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFHTSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQWtCLEVBQUUsTUFBZ0I7UUFDdkQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxNQUFNLFFBQVEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUMsSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsTUFBTSxJQUFJLE1BQU0sS0FBSyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLFNBQVMsRUFBRTtZQUM5RSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZDO0lBQ0gsQ0FBQztDQUNGO0FBM0JELDBDQTJCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElJbWFnZUNvbnRleHQgfSBmcm9tICcuJztcbmltcG9ydCB7IElBY3Rpb25PcHRzLCBSZWFkT25seSwgSW52YWxpZEFyZ3VtZW50IH0gZnJvbSAnLi4nO1xuaW1wb3J0IHsgQmFzZUltYWdlQWN0aW9uIH0gZnJvbSAnLi9fYmFzZSc7XG5leHBvcnQgaW50ZXJmYWNlIEludGVybGFjZU9wdHMgZXh0ZW5kcyBJQWN0aW9uT3B0cyB7XG4gIGludGVybGFjZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEludGVybGFjZUFjdGlvbiBleHRlbmRzIEJhc2VJbWFnZUFjdGlvbiB7XG4gIHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmcgPSAnaW50ZXJsYWNlJztcblxuICBwdWJsaWMgdmFsaWRhdGUocGFyYW1zOiBzdHJpbmdbXSk6IFJlYWRPbmx5PEludGVybGFjZU9wdHM+IHtcbiAgICBsZXQgb3B0OiBJbnRlcmxhY2VPcHRzID0geyBpbnRlcmxhY2U6IGZhbHNlIH07XG5cbiAgICBpZiAocGFyYW1zLmxlbmd0aCAhPT0gMikge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRBcmd1bWVudCgnSW50ZXJsYWNlIHBhcmFtIGVycm9yLCBlLmc6IGludGVybGFjZSwxJyk7XG4gICAgfVxuICAgIGlmIChwYXJhbXNbMV0gPT09ICcxJykge1xuICAgICAgb3B0LmludGVybGFjZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChwYXJhbXNbMV0gPT09ICcwJykge1xuICAgICAgb3B0LmludGVybGFjZSA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZEFyZ3VtZW50KCdJbnRlcmxhY2UgbXVzdCBiZSAwIG9yIDEnKTtcbiAgICB9XG4gICAgcmV0dXJuIG9wdDtcbiAgfVxuXG5cbiAgcHVibGljIGFzeW5jIHByb2Nlc3MoY3R4OiBJSW1hZ2VDb250ZXh0LCBwYXJhbXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgb3B0ID0gdGhpcy52YWxpZGF0ZShwYXJhbXMpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgY3R4LmltYWdlLm1ldGFkYXRhKCk7XG4gICAgaWYgKCgnanBnJyA9PT0gbWV0YWRhdGEuZm9ybWF0IHx8ICdqcGVnJyA9PT0gbWV0YWRhdGEuZm9ybWF0KSAmJiBvcHQuaW50ZXJsYWNlKSB7XG4gICAgICBjdHguaW1hZ2UuanBlZyh7IHByb2dyZXNzaXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgfVxufSJdfQ==