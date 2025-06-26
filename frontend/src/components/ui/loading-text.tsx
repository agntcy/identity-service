import {Typography} from '@outshift/spark-design';

export const LoadingText = ({text}: {text: string}) => {
  return (
    <div className="flex justify-center items-center h-full">
      <span className="animate-fadeInOut">
        <Typography variant="body2" sx={(theme) => ({color: theme.palette.vars.baseTextStrong})}>
          {text || 'Loading...'}
        </Typography>
      </span>
    </div>
  );
};
