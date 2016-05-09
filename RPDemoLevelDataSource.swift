//
//  RPDemoLevelDataSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class RPDemoLevelDataSource: RPLevelDataSource {
    
    let _levelLayers: [RPLevelLayer]
    
    func levelLayers() -> [RPLevelLayer] {
        return _levelLayers
    }
    
    var loadableTypes: [RPResourceLoadableType.Type] = [
        
        RPHairLayerEntity.self,
        RPTowerLayerEntity.self,
        RPTreeLayerEntity.self,
        RPBackgroundLayerEntity.self,
        RPFarBackgroundLayerEntity.self,
        RPHairRibbonPlatformEntity.self,
        RPLeftBranchPlatformEntity.self,
        RPBranchPlatformEntity.self,
        RPPlayerEntity.self
    ]
    
    init() {
        
        _levelLayers = [
            
            RPLevelLayer(name: "ASD", creationHandler: { (levelEntity) -> RPLayerEntity in
                
                let pattern = RPPattern(withNumberOfBeats: 2)
                
                pattern.beats[0] = RPBeat(withType: .NotEmpty)
                pattern.beats[0].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform, creationHandler: {
                    offset, layerEntity in
                    
                    let platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
                    platform.renderComponent.node.position.x = 20
                    platform.renderComponent.node.position.y = offset
                    platform.renderComponent.node.zPosition = 1
                    platform.delegate = layerEntity.entityManagerComponent
                    layerEntity.entityManagerComponent.addEntity(platform)
                    layerEntity.renderComponent.addChild(platform.renderComponent.node)
                    return platform
                    
                }))
                
                /**/
                
                pattern.beats[1] = RPBeat(withType: .NotEmpty)
                pattern.beats[1].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform, creationHandler: {
                    offset, layerEntity in
                    
                    let platform = RPHairRibbonPlatformEntity(isBreakable: false, isBottomCollidable: false)
                    platform.renderComponent.node.position.x = -20
                    platform.renderComponent.node.position.y = offset
                    platform.renderComponent.node.zPosition = 1
                    platform.delegate = layerEntity.entityManagerComponent
                    layerEntity.entityManagerComponent.addEntity(platform)
                    layerEntity.renderComponent.addChild(platform.renderComponent.node)
                    return platform
                    
                }))
                
                let layerEntity = RPHairLayerEntity(withParallaxFactor: 2.0, cameraComponent: levelEntity.cameraEntity.cameraComponent, zPosition: -1, pattern: pattern)
                layerEntity.name = "RPHairLayerEntity"
                return layerEntity
                
            }, loadingHandler: { (completionHandler: () -> ()) -> Void in
                
                RPHairLayerEntity.loadResourcesWithCompletionHandler({
                    completionHandler()
                })
                
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (levelEntity) -> RPLayerEntity in
                
                let layerEntity = RPTowerLayerEntity(withParallaxFactor: 2.0, cameraComponent: levelEntity.cameraEntity.cameraComponent, zPosition: -2)
                layerEntity.name = "RPTowerLayerEntity"
                return layerEntity
                
            }, loadingHandler: { (completionHandler: () -> ()) -> Void in
                
                RPTowerLayerEntity.loadResourcesWithCompletionHandler({ 
                    completionHandler()
                })
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (levelEntity) -> RPLayerEntity in
                
                let pattern = RPPattern(withNumberOfBeats: 2)
                
                pattern.beats[0] = RPBeat(withType: .NotEmpty)
                pattern.beats[0].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform, creationHandler: {
                    offset, layerEntity in
                    
                    let platform = RPLeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
                    platform.renderComponent.node.position.x = 320
                    platform.renderComponent.node.position.y = offset
                    platform.renderComponent.node.zPosition = 1
                    platform.delegate = layerEntity.entityManagerComponent
                    layerEntity.entityManagerComponent.addEntity(platform)
                    layerEntity.renderComponent.addChild(platform.renderComponent.node)
                    return platform
                    
                }))
                
                /**/
                
                pattern.beats[1] = RPBeat(withType: .NotEmpty)
                pattern.beats[1].elements.append(RPBeatElement(withType: RPBeatElementType.RightTreePlatform, creationHandler: {
                    offset, layerEntity in
                    
                    let platform = RPBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
                    platform.renderComponent.node.position.x = -320
                    platform.renderComponent.node.position.y = offset
                    platform.renderComponent.node.zPosition = 1
                    platform.delegate = layerEntity.entityManagerComponent
                    layerEntity.entityManagerComponent.addEntity(platform)
                    layerEntity.renderComponent.addChild(platform.renderComponent.node)
                    return platform
                    
                }))
                
                let layerEntity = RPTreeLayerEntity(withParallaxFactor: 1.5, cameraComponent: levelEntity.cameraEntity.cameraComponent, zPosition: 1, pattern: pattern)
                layerEntity.name = "RPTreeLayerEntity"
                return layerEntity
                
            }, loadingHandler: { (completionHandler: () -> ()) -> Void in
                
                RPTreeLayerEntity.loadResourcesWithCompletionHandler({ 
                    completionHandler()
                })
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (levelEntity) -> RPLayerEntity in
                
                let layerEntity = RPBackgroundLayerEntity(withParallaxFactor: 3.0, cameraComponent: levelEntity.cameraEntity.cameraComponent, zPosition: -3)
                layerEntity.name = "RPBackgroundLayerEntity"
                return layerEntity
                
            }, loadingHandler: { (completionHandler: () -> ()) -> Void in
                
                RPBackgroundLayerEntity.loadResourcesWithCompletionHandler({ 
                    completionHandler()
                })
            }),
            
            RPLevelLayer(name: "ASD", creationHandler: { (levelEntity) -> RPLayerEntity in
                
                let layerEntity = RPFarBackgroundLayerEntity(withParallaxFactor: 8.0, cameraComponent: levelEntity.cameraEntity.cameraComponent, zPosition: -5)
                layerEntity.name = "RPFarBackgroundLayerEntity"
                return layerEntity
                
            }, loadingHandler: { (completionHandler: () -> ()) -> Void in
                
                RPFarBackgroundLayerEntity.loadResourcesWithCompletionHandler({ 
                    completionHandler()
                })
            })
        ]
    }
}