import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  const currentStepObj = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className="w-full py-0.5">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center !w-6 !h-6 sm:!w-7 sm:!h-7 rounded-full text-[11px] font-bold transition-all duration-300",
                  currentStep > step.id && "bg-secondary text-secondary-foreground",
                  currentStep === step.id && "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20",
                  currentStep < step.id && "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-1 text-center hidden sm:block">
                <p
                  className={cn(
                    "text-[10px] sm:text-[11px] font-semibold leading-tight whitespace-nowrap",
                    currentStep >= step.id ? "text-foreground font-bold" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-1.5 sm:mx-2.5">
                <div className="h-0.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 bg-gradient-to-r from-primary to-secondary",
                      currentStep > step.id ? "w-full" : "w-0"
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Step Title Pill */}
      <div className="sm:hidden text-center mt-1.5">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-bold text-foreground">
          Step {currentStep} of {steps.length}: <span className="text-primary">{currentStepObj.title}</span>
        </span>
      </div>
    </div>
  );
};

export default StepIndicator;
