import { of, switchMap } from 'rxjs';
export const handleEvent = (project) => (source) => source.pipe(switchMap((payload) => (payload === null ? of(null) : project(payload))));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlLWV2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvZGF0YS1hY2Nlc3Mvc3JjL2xpYi9pbnRlcm5hbHMvaGFuZGxlLWV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBYyxFQUFFLEVBQUUsU0FBUyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBRWpELE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FDdEIsQ0FDRSxPQUE2RCxFQUM3RCxFQUFFLENBQ0osQ0FBQyxNQUFxQyxFQUFpQyxFQUFFLENBQ3ZFLE1BQU0sQ0FBQyxJQUFJLENBQ1QsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FDekUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIG9mLCBzd2l0Y2hNYXAgfSBmcm9tICdyeGpzJztcblxuZXhwb3J0IGNvbnN0IGhhbmRsZUV2ZW50ID1cbiAgPFNvdXJjZVR5cGUsIE91dHB1dFR5cGU+KFxuICAgIHByb2plY3Q6ICh2YWx1ZTogU291cmNlVHlwZSkgPT4gT2JzZXJ2YWJsZTxPdXRwdXRUeXBlIHwgbnVsbD5cbiAgKSA9PlxuICAoc291cmNlOiBPYnNlcnZhYmxlPFNvdXJjZVR5cGUgfCBudWxsPik6IE9ic2VydmFibGU8T3V0cHV0VHlwZSB8IG51bGw+ID0+XG4gICAgc291cmNlLnBpcGUoXG4gICAgICBzd2l0Y2hNYXAoKHBheWxvYWQpID0+IChwYXlsb2FkID09PSBudWxsID8gb2YobnVsbCkgOiBwcm9qZWN0KHBheWxvYWQpKSlcbiAgICApO1xuIl19