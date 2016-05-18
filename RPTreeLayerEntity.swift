//
//  TreeLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

enum TreePlatformPosition: CGFloat {
    
    case Left = -320
    case Right = 320
}

class TreeLayerEntity: LayerEntity, ResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var tileAtlas: SKTextureAtlas!
    static var tileSet: TileSet!
    
    // MARK: - Components
    
    var tileComponent: TileComponent {
        guard let tileComponent = componentForClass(TileComponent) else { fatalError() }
        return tileComponent
    }
    
    // MARK: - Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: CameraComponent, zPosition: CGFloat = 0.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        let tileComponent = TileComponent(withEntity: self, tileSet: TreeLayerEntity.tileSet)
        addComponent(tileComponent)

        self.name = "TreeLayerEntity"
    }
}

extension TreeLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return tileAtlas == nil
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        tileAtlas = SKTextureAtlas(named: "RPTreeLayer")
        tileAtlas.preloadWithCompletionHandler { () -> Void in
            
            tileSet = TileComponent.tileSetFromAtlas(tileAtlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        tileAtlas = nil
    }
    
}
