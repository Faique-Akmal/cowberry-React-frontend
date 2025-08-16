<Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
           <div>
                <span className="font-medium text-gray-700">Title:</span>
                <span className="ml-2 text-gray-900">{selectedTask.title}</span>
              </div>
            <div className="mt-8">
              <div>
                <div>
                                <span className="font-medium text-gray-700">Date:</span>
                                <span className="ml-2 text-gray-900">
                                  {dayjs(selectedTask.startStr).format("MMMM D, YYYY")}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  selectedTask.extendedProps?.status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : selectedTask.extendedProps?.status === 'in-progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedTask.extendedProps?.status || 'pending'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Description:</span>
                                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">
                                  {selectedTask.extendedProps?.description || 'No description available'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Assigned By:</span>
                                <span className="ml-2 text-gray-900">
                                  {getRoleName(selectedTask.extendedProps?.assigned_by || 'Unknown')}
                                  {/* {selectedTask.extendedProps?.assigned_by || 'Unknown'} */}
                                </span>
                              </div>
                            </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </Modal>