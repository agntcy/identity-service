import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import AgntcyLogo from '@/assets/agntcy-logo.svg';
import {Separator} from '@/components/ui/separator';
import useAuth from '@/providers/auth-provider/use-auth';
import '@/styles/welcome.css';

const Welcome = () => {
  const {login, register} = useAuth();
  return (
    <div className="flex h-screen">
      <div className="hidden bg-[#00142B] md:flex flex-col w-1/2 basis-1/2 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-2 w-[80%]">
          <img src={AgntcyLogo} alt="Agntcy Logo" />
          <h1 className="welcome-title">Identity</h1>
          <p className="welcome-desc mt-10">A service for authenticate and collaborating on Agents.</p>
        </div>
        <div className="relative z-20 flex flex-col justify-between	text-lg font-medium h-full">
          <div />
          <div className="relative z-20 bg-red-500 h-[26px] w-full striped-bar" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-between w-full md:w-1/2 md:basis-1/2">
        <div className="p-10"></div>
        <Card className="h-fit dark:rounded-none dark:border-none flex items-center justify-center w-fit p-10">
          <div className="max-w-[30rem] flex flex-col gap-8">
            <div className="min-w-[300px]">
              <h1 className="text-2xl mb-4 font-semibold welcome-title-1">AGNTCY Identity</h1>
              <div className="text-center">
                <h2 className="text-muted-foreground mb-2 text-lg">Secure and Verifiable Agent Identification</h2>
                <p className="text-sm">
                  AGNTCY Identity provides a secure and verifiable method to uniquely identify agents using open and decentralized techniques.
                </p>
              </div>
              <Separator className="mt-4 mb-8" />
              <div className="w-auto">
                <Button onClick={() => login?.()} className="w-full">
                  Sign In
                </Button>
                <p className="text-center mt-[1rem] text-[12px]">
                  {"Don't have an account? "}
                  <span className="hover:underline font-bold italic hover:cursor-pointer" onClick={() => register?.()}>
                    {'Sign Up'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
        <div />
      </div>
    </div>
  );
};

export default Welcome;
