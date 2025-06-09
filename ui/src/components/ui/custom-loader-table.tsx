import {Card, CardContent, CardHeader, CardTitle} from './card';
import {Skeleton} from './skeleton';

const CustomLoaderTable = ({title}: {title?: string | React.ReactNode}) => {
  return (
    <div className="m-auto w-full text-center">
      <Card className={`p-0 ${!title && 'pt-4'}`}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="px-4">
          {Array.from({length: 6}).map((_, index) => (
            <Skeleton key={index} className="w-full h-[20px] rounded-full mt-4" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomLoaderTable;
