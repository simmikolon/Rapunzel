//
//  RPBackgroundLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPBackgroundLayerEntity: RPLayerEntity, RPResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var atlas: SKTextureAtlas!
    static var tileSet: RPTileSet!
    
    // MARK: Components
    
    var tileComponent: RPTileComponent!
    
    // MARK: Initialisation
    
    init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: RPCameraComponent, zPosition: CGFloat = 0.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        self.tileComponent = RPTileComponent(withEntity: self, tileSet: RPBackgroundLayerEntity.tileSet)
        
        addComponent(self.tileComponent)
        
        self.name = "RPBackgroundLayerEntity"
    }
}

extension RPBackgroundLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return atlas == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        atlas = SKTextureAtlas(named: "RPBackgroundLayer")
        atlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = RPTileComponent.tileSetFromAtlas(atlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        atlas = nil
    }
}