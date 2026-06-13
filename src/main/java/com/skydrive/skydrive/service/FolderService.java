package com.skydrive.skydrive.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.skydrive.skydrive.dto.folder.CreateFolderRequest;
import com.skydrive.skydrive.dto.folder.FolderResponse;
import com.skydrive.skydrive.dto.folder.FolderTreeResponse;
import com.skydrive.skydrive.entity.Folder;
import com.skydrive.skydrive.entity.User;
import com.skydrive.skydrive.exception.ResourceNotFoundException;
import com.skydrive.skydrive.repository.FolderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FolderService {
    
    private final FolderRepository folderRepository;
    private final UserService userService;

    public FolderResponse createFolder(CreateFolderRequest request){
        User currentUser = userService.getCurrentUser();

        Folder parentFolder = null;

        if(request.getParentFolderId() != null){
            parentFolder = folderRepository.findById(request.getParentFolderId())
                .orElseThrow();
        }

        Folder folder = Folder.builder()
                .name(request.getName())
                .owner(currentUser)
                .parentFolder(parentFolder)
                .build();
        Folder savedFolder = folderRepository.save(folder);
        return mapToResponse(savedFolder);
    }

    private FolderResponse mapToResponse(Folder folder){

        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentFolderId(folder.getParentFolder() != null ? folder.getParentFolder().getId() : null)
                .createdAt(folder.getCreatedAt())
                .build();                
    }

    public Folder getFolder(Long folderId){

        User currentUser = userService.getCurrentUser();

        Folder folder = folderRepository.findById(folderId)
                        .orElseThrow(()-> new ResourceNotFoundException("Folder not found"));

        if(!folder.getOwner().getId().equals(currentUser.getId())){
            throw new AccessDeniedException("Access denied");
        }

        return folder;
    }

    public List<FolderTreeResponse> getFolderTree(){

        User currentUser = userService.getCurrentUser();

        List<Folder> folders = folderRepository.findByOwnerId(currentUser.getId());

        Map<Long, FolderTreeResponse> map = 
                folders.stream()
                    .collect(Collectors.toMap(
                        Folder::getId,
                    folder -> FolderTreeResponse.builder()
                            .id(folder.getId())
                        .name(folder.getName())
                    .build()
                    ));
        List<FolderTreeResponse> roots = new java.util.ArrayList<>();

            for(Folder folder: folders){

                FolderTreeResponse current = map.get(folder.getId());

                if(folder.getParentFolder() == null){
                    roots.add(current);
                }else{
                    FolderTreeResponse parent = map.get(folder.getParentFolder().getId()
                );

                if(parent != null){
                    parent.getChildren().add(current);
                }
            }
        }
        return roots;
    }

    public void createDefaultFolders(User user){
        
        Folder documents = Folder.builder()
            .name("Documents")
            .owner(user)
            .build();
        
        Folder images = Folder.builder()
            .name("Images")
            .owner(user)
            .build();

        Folder videos = Folder.builder()
            .name("Videos")
            .owner(user)
            .build();

        Folder projects = Folder.builder()
            .name("Projects")
            .owner(user)
            .build();

        
        folderRepository.save(documents);
        folderRepository.save(images);
        folderRepository.save(videos);
        folderRepository.save(projects);

    }
}
