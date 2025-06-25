import PlaceholderPageContent from '@/components/ui/placeholder-page-content';

export const CreateOrganizationForm = () => {
  // const [confirmOpen, setConfirmOpen] = useState(false);
  // const [organizationName, setOrganizationName] = useState<string>('');

  // const createOrganizationMutation = useCreateOrganization({
  //   callbacks: {
  //     onSuccess: () => {
  //       toast.success('Organization created successfully.');
  //       setConfirmOpen(false);
  //     },
  //     onError: () => {
  //       toast.error('Failed to create organization.');
  //     }
  //   }
  // });

  // const handleOnConfirmCreate = useCallback(() => {
  //   createOrganizationMutation.mutate({ name: organizationName });
  // }, [createOrganizationMutation, organizationName]);

  return (
    <>
      <PlaceholderPageContent />
    </>
  );
};
